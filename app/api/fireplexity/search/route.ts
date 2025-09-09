import { NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, generateText, createUIMessageStream, createUIMessageStreamResponse, convertToModelMessages } from 'ai'
import type { ModelMessage } from 'ai'
import { detectCompanyTicker } from '@/lib/company-ticker-map'
import { selectRelevantContent } from '@/lib/content-selection'

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] Starting search request`)
  
  try {
    const body = await request.json()
    const messages = body.messages || []
    console.log(`[${requestId}] Request body:`, JSON.stringify(body, null, 2))
    
    // Extract query from v5 message structure (messages have parts array)
    let query = body.query
    if (!query && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.parts) {
        // v5 structure
        const textParts = lastMessage.parts.filter((p: any) => p.type === 'text')
        query = textParts.map((p: any) => p.text).join(' ')
      } else if (lastMessage.content) {
        // Fallback for v4 structure
        query = lastMessage.content
      }
    }

    if (!query) {
      console.log(`[${requestId}] No query found in request`)
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }
    
    console.log(`[${requestId}] Extracted query:`, query)

    // Use OpenAI compatible API for AI responses
    const openaiApiKey = process.env.OPENAI_API_KEY
    const openaiBaseUrl = process.env.OPENAI_BASE_URL
    
    console.log(`[${requestId}] OpenAI config - API Key: ${openaiApiKey ? 'Set' : 'Not set'}, Base URL: ${openaiBaseUrl}`)
    
    if (!openaiApiKey) {
      console.log(`[${requestId}] OpenAI API key not configured`)
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Configure OpenAI compatible client
    const openai = createOpenAI({
      apiKey: openaiApiKey,
      baseURL: openaiBaseUrl
    })

    // Always perform a fresh search for each query to ensure relevant results
    const isFollowUp = messages.length > 2
    
    // Create a UIMessage stream with custom data parts
    const stream = createUIMessageStream({
      originalMessages: messages,
      execute: async ({ writer }) => {
        try {
          let sources: Array<{
            url: string
            title: string
            description?: string
            content?: string
            markdown?: string
            publishedDate?: string
            author?: string
            image?: string
            favicon?: string
            siteName?: string
          }> = []
          let newsResults: Array<{
            url: string
            title: string
            description?: string
            publishedDate?: string
            source?: string
            image?: string
          }> = []
          let imageResults: Array<{
            url: string
            title: string
            thumbnail?: string
            source?: string
            width?: number
            height?: number
            position?: number
          }> = []
          let context = ''
          
          // Send status updates as transient data parts
          writer.write({
            type: 'data-status',
            id: 'status-1',
            data: { message: 'Starting search...' },
            transient: true
          })
          
          writer.write({
            type: 'data-status',
            id: 'status-2',
            data: { message: 'Searching for relevant sources...' },
            transient: true
          })
          
          // Convert query to search URLs
          let urlsToCrawl: string[] = []
          
          // Check if query looks like a URL
          if (query.match(/^https?:\/\//)) {
            urlsToCrawl = [query]
            console.log(`[${requestId}] Query is URL, crawling:`, urlsToCrawl)
          } else {
            // For non-URL queries, we'll use some common knowledge sources
            // This is a simplified approach - in production you'd want to use a search engine
            const encodedQuery = encodeURIComponent(query)
            urlsToCrawl = [
              `https://en.wikipedia.org/wiki/${encodedQuery}`,
              `https://www.bing.com/search?q=${encodedQuery}`,
              `https://www.google.com/search?q=${encodedQuery}`,
              `https://www.yahoo.com/search?q=${encodedQuery}`,
              `https://www.duckduckgo.com/search?q=${encodedQuery}`,
              `https://www.yandex.com/search?q=${encodedQuery}`,
              `https://www.baidu.com/search?q=${encodedQuery}`
            ]
            console.log(`[${requestId}] Query is search term, crawling URLs:`, urlsToCrawl)
          }

          // Make API call to local Crawl4ai service using /md endpoint
          console.log(`[${requestId}] Calling Crawl4ai /md API with URLs:`, urlsToCrawl)
          
          // Try crawling with fallback strategy using /md endpoint
          let searchResult;
          
          try {
            // Try crawling each URL concurrently using /md endpoint
            console.log(`[${requestId}] Starting concurrent crawling of ${urlsToCrawl.length} URLs`)
            
            const crawlPromises = urlsToCrawl.map(async (url) => {
              try {
                console.log(`[${requestId}] Crawling URL:`, url)
                const response = await fetch('http://localhost:11234/md', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    url: url
                  })
                })
                
                if (response.ok) {
                  const result = await response.json()
                  console.log(`[${requestId}] Successfully crawled:`, url)
                  return {
                    url: url,
                    title: result.title || url,
                    content: result.content || '',
                    markdown: result.markdown || '',
                    metadata: { title: result.title },
                    success: true
                  }
                } else {
                  console.log(`[${requestId}] Failed to crawl:`, url, response.status)
                  return null
                }
              } catch (urlError) {
                console.log(`[${requestId}] Error crawling URL ${url}:`, urlError)
                return null
              }
            })
            
            const crawlResults = await Promise.all(crawlPromises)
            const results = crawlResults.filter(result => result !== null)
            
            if (results.length > 0) {
              searchResult = {
                success: true,
                results: results
              }
              console.log(`[${requestId}] Successfully crawled ${results.length} URLs`)
            } else {
              throw new Error('All crawl attempts failed')
            }
            
          } catch (error) {
            console.log(`[${requestId}] All crawl attempts failed:`, error)
            // Create a minimal result to keep the flow going
            searchResult = {
              success: true,
              results: [{
                url: urlsToCrawl[0],
                title: "Search Result",
                content: `Information about: ${query}`,
                markdown: `# ${query}\n\nThis is a placeholder result for the search query: ${query}`,
                metadata: { title: query },
                success: true
              }]
            }
            console.log(`[${requestId}] Using placeholder result`)
          }

          // searchResult is now available from the try-catch block above
          
          // Transform Crawl4ai response to match expected format
          const webResults = searchResult.results || []
          const newsData: any[] = [] // Crawl4ai doesn't provide news search, keeping empty for now
          const imagesData: any[] = [] // Crawl4ai doesn't provide image search, keeping empty for now
          
          // Transform web sources metadata from Crawl4ai response
          console.log(`[${requestId}] Processing ${webResults.length} web results`)
          sources = webResults.map((item: any) => {
            const source = {
              url: item.url,
              title: item.metadata?.title || item.url,
              description: item.metadata?.description || '',
              content: item.extracted_content || item.cleaned_html,
              markdown: item.markdown?.raw_markdown || item.markdown,
              favicon: undefined, // Crawl4ai doesn't provide favicon
              image: undefined, // Crawl4ai doesn't provide ogImage
              siteName: item.url ? new URL(item.url).hostname : undefined
            };
            console.log(`[${requestId}] Processed source:`, { url: source.url, title: source.title, hasContent: !!source.content, hasMarkdown: !!source.markdown })
            return source;
          }).filter((item: any) => item.url) || []
          
          console.log(`[${requestId}] Final sources count:`, sources.length)

          // Transform news results - now with correct schema
          newsResults = newsData.map((item: any) => {
            return {
              url: item.url,
              title: item.title,
              description: item.snippet || item.description,
              publishedDate: item.date,  // Direct API returns 'date' field
              source: item.source || (item.url ? new URL(item.url).hostname : undefined),
              image: item.imageUrl  // Direct API returns 'imageUrl' for news thumbnails
            };
          }).filter((item: any) => item.url) || []

          // Transform image results - now with correct schema from direct API
          imageResults = imagesData.map((item: any) => {
            // Verify we have the required fields
            if (!item.url || !item.imageUrl) {
              return null;
            }
            return {
              url: item.url,
              title: item.title || 'Untitled',
              thumbnail: item.imageUrl,  // Direct API returns 'imageUrl' field
              source: item.url ? new URL(item.url).hostname : undefined,
              width: item.imageWidth,
              height: item.imageHeight,
              position: item.position
            };
          }).filter((item): item is NonNullable<typeof item> => item !== null) || []  // Filter out null entries
          
          // Send all sources as a persistent data part
          console.log(`[${requestId}] Sending sources data:`, { sourcesCount: sources.length, newsCount: newsResults.length, imagesCount: imageResults.length })
          writer.write({
            type: 'data-sources',
            id: 'sources-1',
            data: {
              sources,
              newsResults,
              imageResults
            }
          })
          
          // Small delay to ensure sources render first
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Update status
          writer.write({
            type: 'data-status',
            id: 'status-3',
            data: { message: 'Analyzing sources and generating answer...' },
            transient: true
          })
          
          // Detect if query is about a company
          const ticker = detectCompanyTicker(query)
          if (ticker) {
            writer.write({
              type: 'data-ticker',
              id: 'ticker-1',
              data: { symbol: ticker }
            })
          }
          
          // Prepare context from sources with intelligent content selection
          console.log(`[${requestId}] Preparing context from ${sources.length} sources`)
          context = sources
            .map((source: { title: string; markdown?: string; content?: string; url: string }, index: number) => {
              const content = source.markdown || source.content || ''
              const relevantContent = selectRelevantContent(content, query, 2000)
              console.log(`[${requestId}] Source ${index + 1} context length:`, relevantContent.length)
              return `[${index + 1}] ${source.title}\nURL: ${source.url}\n${relevantContent}`
            })
            .join('\n\n---\n\n')
          
          console.log(`[${requestId}] Total context length:`, context.length)

          
          // Prepare messages for the AI
          let aiMessages: ModelMessage[] = []
          
          if (!isFollowUp) {
            // Initial query with sources
            aiMessages = [
              {
                role: 'system',
                content: `You are a friendly assistant that helps users find information.

                CRITICAL FORMATTING RULE:
                - NEVER use LaTeX/math syntax ($...$) for regular numbers in your response
                - Write ALL numbers as plain text: "1 million" NOT "$1$ million", "50%" NOT "$50\\%$"
                - Only use math syntax for actual mathematical equations if absolutely necessary
                
                RESPONSE STYLE:
                - For greetings (hi, hello), respond warmly and ask how you can help
                - For simple questions, give direct, concise answers
                - For complex topics, provide detailed explanations only when needed
                - Match the user's energy level - be brief if they're brief
                
                FORMAT:
                - Use markdown for readability when appropriate
                - Keep responses natural and conversational
                - Include citations inline as [1], [2], etc. when referencing specific sources
                - Citations should correspond to the source order (first source = [1], second = [2], etc.)
                - Use the format [1] not CITATION_1 or any other format`
              },
              {
                role: 'user',
                content: `Answer this query: "${query}"\n\nBased on these sources:\n${context}`
              }
            ]
          } else {
            // Follow-up question - still use fresh sources from the new search
            aiMessages = [
              {
                role: 'system',
                content: `You are a friendly assistant continuing our conversation.

                CRITICAL FORMATTING RULE:
                - NEVER use LaTeX/math syntax ($...$) for regular numbers in your response
                - Write ALL numbers as plain text: "1 million" NOT "$1$ million", "50%" NOT "$50\\%$"
                - Only use math syntax for actual mathematical equations if absolutely necessary
                
                REMEMBER:
                - Keep the same conversational tone from before
                - Build on previous context naturally
                - Match the user's communication style
                - Use markdown when it helps clarity
                - Include citations inline as [1], [2], etc. when referencing specific sources
                - Citations should correspond to the source order (first source = [1], second = [2], etc.)
                - Use the format [1] not CITATION_1 or any other format`
              },
              // Include conversation context - convert UIMessages to ModelMessages
              ...convertToModelMessages(messages.slice(0, -1)),
              // Add the current query with the fresh sources
              {
                role: 'user',
                content: `Answer this query: "${query}"\n\nBased on these sources:\n${context}`
              }
            ]
          }
          
          // Stream the text generation using OpenAI compatible model
          console.log(`[${requestId}] Starting AI text generation with ${aiMessages.length} messages`)
          const result = streamText({
            model: openai('gpt-4o'),
            messages: aiMessages,
            temperature: 0.7,
            maxRetries: 2
          })
          
          console.log(`[${requestId}] Merging AI stream into UIMessage stream`)
          // Merge the AI stream into our UIMessage stream
          writer.merge(result.toUIMessageStream())
          
          // Get the full answer for follow-up generation
          console.log(`[${requestId}] Getting full answer text`)
          const fullAnswer = await result.text
          console.log(`[${requestId}] Full answer length:`, fullAnswer.length)
          
          // Generate follow-up questions
          const conversationPreview = isFollowUp 
            ? messages.map((m: { role: string; parts?: any[] }) => {
                const content = m.parts 
                  ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ')
                  : ''
                return `${m.role}: ${content}`
              }).join('\n\n')
            : `user: ${query}`
            
          try {
            const followUpResponse = await generateText({
              model: openai('gpt-3.5-turbo'),
              messages: [
                {
                  role: 'system',
                  content: `Generate 5 natural follow-up questions based on the query and answer.\n                \n                ONLY generate questions if the query warrants them:\n                - Skip for simple greetings or basic acknowledgments\n                - Create questions that feel natural, not forced\n                - Make them genuinely helpful, not just filler\n                - Focus on the topic and sources available\n                \n                If the query doesn't need follow-ups, return an empty response.
                  ${isFollowUp ? 'Consider the full conversation history and avoid repeating previous questions.' : ''}
                  Return only the questions, one per line, no numbering or bullets.`
                },
                {
                  role: 'user',
                  content: `Query: ${query}\n\nAnswer provided: ${fullAnswer.substring(0, 500)}...\n\n${sources.length > 0 ? `Available sources about: ${sources.map((s: { title: string }) => s.title).join(', ')}\n\n` : ''}Generate 5 diverse follow-up questions that would help the user learn more about this topic from different angles.`
                }
              ],
              temperature: 0.7,
              maxRetries: 2
            })
            
            // Process follow-up questions
            const followUpQuestions = followUpResponse.text
              .split('\n')
              .map((q: string) => q.trim())
              .filter((q: string) => q.length > 0)
              .slice(0, 5)

            // Send follow-up questions as a data part
            console.log(`[${requestId}] Sending ${followUpQuestions.length} follow-up questions`)
            writer.write({
              type: 'data-followup',
              id: 'followup-1',
              data: { questions: followUpQuestions }
            })
          } catch (followUpError) {
            // Error generating follow-up questions
          }
          
        } catch (error) {
          console.log(`[${requestId}] Error in execute function:`, error)
          
          // Handle specific error types
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          const statusCode = error && typeof error === 'object' && 'statusCode' in error 
            ? error.statusCode 
            : error && typeof error === 'object' && 'status' in error
            ? error.status
            : undefined
          
          // Provide user-friendly error messages
          const errorResponses: Record<number, { error: string; suggestion?: string }> = {
            401: {
              error: 'Invalid API key',
              suggestion: 'Please check your API key is correct.'
            },
            402: {
              error: 'Insufficient credits',
              suggestion: 'You\'ve run out of credits. Please upgrade your plan.'
            },
            429: {
              error: 'Rate limit exceeded',
              suggestion: 'Too many requests. Please wait a moment and try again.'
            },
            504: {
              error: 'Request timeout',
              suggestion: 'The search took too long. Try a simpler query or fewer sources.'
            }
          }
          
          const errorResponse = statusCode && errorResponses[statusCode as keyof typeof errorResponses] 
            ? errorResponses[statusCode as keyof typeof errorResponses]
            : { error: errorMessage }
          
          writer.write({
            type: 'data-error',
            id: 'error-1',
            data: {
              error: errorResponse.error,
              ...(errorResponse.suggestion ? { suggestion: errorResponse.suggestion } : {}),
              ...(statusCode ? { statusCode } : {})
            },
            transient: true
          })
        }
      }
    })
    
    return createUIMessageStreamResponse({ stream })
    
  } catch (error) {
    console.log(`[${requestId}] Top-level error:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    return NextResponse.json(
      { error: 'Search failed', message: errorMessage, details: errorStack },
      { status: 500 }
    )
  }
}