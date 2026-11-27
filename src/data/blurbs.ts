/**
 * The paragraph under a drink's name in Browse mode (Figma 256:832).
 *
 * Each is a short history of the drink, no longer than the Negroni's (whose text comes from JP's design).
 * The others were written on 2026-11-27 (JP asked for histories in place of tasting notes) and checked the same
 * day against Wikipedia, Difford's Guide, Punch, Smithsonian, Britannica and others. Where an origin is
 * disputed or a legend, the text says so.
 */
export const BLURBS: Record<string, string> = {
  negroni:
    "The Negroni is widely believed to have originated in Florence in 1919, when Count Camillo Negroni asked bartender Fosco Scarselli at Caffè Casoni to strengthen his usual Americano by replacing its soda water with gin. Scarselli reportedly added an orange garnish instead of lemon, distinguishing the new drink. Made with equal parts gin, Campari, and sweet vermouth, the Negroni became a staple of Italian aperitivo culture before gaining worldwide popularity. Though its precise origins remain debated, its bittersweet balance and simple recipe have made it one of the world’s most enduring classic cocktails.",
  gimlet:
    "The Gimlet grew out of British seafaring. Sailors were given lime juice to ward off scurvy, and in 1867 Lauchlin Rose patented a sweetened lime cordial that kept at sea; mixed with gin, it became a ready-made drink. The name is often credited to naval surgeon Sir Thomas Gimlette, though some say it comes from the gimlet, a small tool for boring holes in barrels. It was in cocktail books by the early 1920s, and Raymond Chandler’s The Long Goodbye made it famous in 1953.",
  daiquiri:
    "The Daiquiri is named for an iron-mining town near Santiago de Cuba. Around 1900, an American engineer there, Jennings Cox, is said to have mixed local rum with lime and sugar for his guests. A US Navy medical officer, Lucius Johnson, brought it to Washington’s Army and Navy Club in 1909. In Havana, bartender Constantino Ribalaigua perfected it at El Floridita, where Ernest Hemingway became a famous regular, and it is still the template for every rum sour.",
  "whiskey-sour":
    "Sours likely began at sea, where sailors mixed spirits with citrus and sugar to keep scurvy away. They first appeared as a family in Jerry Thomas’s 1862 Bartender’s Guide, one of the earliest American cocktail books, and the Whiskey Sour by name turns up in American newspapers from the 1860s and 1870s. It became a fixture of American bars, often shaken with egg white for a silky foam, and has stayed among the most ordered whiskey drinks for over a century.",
  margarita:
    "No one agrees on who made the first Margarita. One story credits Carlos Herrera, said to have mixed it near Tijuana in the late 1930s or 1940s for a showgirl who couldn’t drink other spirits; another credits Dallas socialite Margarita Sames in Acapulco in 1948, though tequila ads named the drink before then. Most likely it grew from the Daisy, an older family of spirit, citrus and orange liqueur drinks, and “margarita” is Spanish for daisy. The frozen version took off in the 1970s.",
  cosmopolitan:
    "The Cosmopolitan is a modern classic from the 1980s. Bartender Cheryl Cook said she first mixed it around 1985 at the Strand in Miami’s South Beach, and in 1988 Toby Cecchini at the Odeon in New York refined it with fresh lime and Cointreau. Bartenders passed it around in the years that followed, and in the late 1990s it became famous as the drink of choice on the television series Sex and the City, which made it one of the defining cocktails of the decade.",
  "tom-collins":
    "The Tom Collins may take its name from a prank. In 1874, people across New York told friends that a man named Tom Collins had been saying things about them in a bar nearby, sending them off to find a man who didn’t exist, and bartenders soon had a drink by that name. It may also trace back to John Collins, a headwaiter at Limmer’s Hotel in London, whose gin punch was known in the early 1800s; Old Tom gin may then have turned John into Tom.",
  mojito:
    "The Mojito comes from Cuba. Legend links it to El Draque, a drink of rough cane spirit, lime, sugar and mint said to date to the crew of Sir Francis Drake in the 1500s, though the name is first recorded in the 1830s. When rum took the place of the cane spirit, the drink became the Mojito, and soda water stretched it into a long drink for the heat. Havana’s La Bodeguita del Medio made it famous with visitors from the 1940s, and its revival in the 2000s took it worldwide.",
  "old-fashioned":
    "In 1806, a New York newspaper defined the “cocktail” as spirit, sugar, water and bitters. As bartenders later added liqueurs, absinthe and other flourishes, some drinkers asked for a whiskey cocktail made the old-fashioned way, and “old fashioned cocktails” were in print by 1880. Louisville’s Pendennis Club claims to have created it soon after, a story historians doubt. Its revival in the 2000s, helped by the series Mad Men, made it one of America’s most ordered cocktails again.",
  manhattan:
    "The Manhattan is traced to New York in the 1870s or early 1880s. A popular story says it was created at the Manhattan Club for a banquet hosted by Jennie Jerome, Winston Churchill’s mother, but she was in England at the time, so the tale is likely untrue. It was named in print by 1882, and full recipes followed in 1884. Rye whiskey and sweet vermouth with bitters became a standard, and the Manhattan inspired many later drinks, including the Martinez and, through it, the Martini.",
  martini:
    "The Martini most likely grew out of the Martinez, a sweeter mix of gin, sweet vermouth and maraschino printed in the 1880s and described as a Manhattan made with gin. Its name may come from the town of Martinez, California, or from Martini & Rossi vermouth. Over the 1900s, as dry vermouth and London dry gin took over, the drink grew steadily drier and colder. By mid-century it was the emblem of American cocktail culture, and it remains the most famous cocktail in the world.",
  "gin-and-tonic":
    "The Gin and Tonic is tied to British India in the 1800s. Quinine, taken from cinchona bark, protected against malaria but was very bitter, so it was taken with soda and sugar, and then with gin. Commercial tonic water appeared in the 1850s, Schweppes launched its Indian Quinine Tonic in 1870, and the earliest mentions of the drink, from 1868 on, come from India. It became Britain’s signature long drink, and the gin revival of the 2000s brought it a new wave of popularity.",
  "moscow-mule":
    "The Moscow Mule was invented in Los Angeles around 1941 to sell two things nobody wanted. John G. Martin’s company, Heublein, had bought the rights to Smirnoff vodka, then little known in America, and Jack Morgan of the Cock ’n’ Bull pub had a ginger beer that wasn’t selling. Mixed with lime and served in a copper mug, they made a hit. Martin promoted it by photographing bartenders with the drink, and it helped make vodka popular across the country.",
  "aperol-spritz":
    "The spritz is a drink of the Veneto; its name comes from the German spritzen, to splash, and the story goes that Austrian soldiers there in the 1800s added a splash of water to local wine. Aperol, a bright orange bitter, was launched in Padua in 1919 by the brothers Luigi and Silvio Barbieri, and in time it became the spritz’s best-known partner. It stayed a regional aperitivo for decades, until Campari bought the brand in 2003 and turned it into a symbol of Italian summer.",
  "hot-toddy":
    "The Hot Toddy goes back to the 1700s in Britain and Ireland. Its name is usually traced to “taddy,” a drink made from fermented palm sap in British India, though the link is debated. By the late 1700s, a toddy meant spirit mixed with hot water, sugar and spice. The Scots made it with whisky, and it became the classic remedy for colds and cold nights, valued as much for comfort as for taste. Honey, lemon and cinnamon are the usual modern finish.",
  "arnold-palmer":
    "The Arnold Palmer is named for the American golfer who made it his everyday drink. Palmer said he first mixed iced tea and lemonade at home, then began ordering it when he was out. As the story goes, a woman at a bar overheard him and asked for “that Palmer drink,” and the name stuck. It later became a bottled drink. Palmer himself liked it with more tea than lemonade. It has no alcohol, and a splash of vodka makes it a “John Daly.”",
  "shirley-temple":
    "The Shirley Temple is named for the child film star of the 1930s, who was too young to drink at grown-up parties. Several places claim to have made it first, including the Brown Derby and Chasen’s in Los Angeles and the Royal Hawaiian Hotel in Honolulu, each mixing ginger ale with grenadine and a cherry so she could join in. It became the best-known drink for children in America, though Temple herself later called it a “saccharine sweet, icky drink.”",
  "espresso-martini":
    "The Espresso Martini was created by London bartender Dick Bradsell in the 1980s, by most accounts in 1983 at the Soho Brasserie. As the story goes, a well-known model asked him for a drink that would wake her up and keep her going, and he shook vodka with fresh espresso, coffee liqueur and sugar. He first called it the Vodka Espresso; by the late 1990s it was served in a cocktail glass as the Espresso Martini. It became one of the most popular cocktails of the 2020s.",
};

/** The Browse paragraph for a drink; saved drinks and anything without copy get a plain line. */
export function blurbFor(id: string, fallbackName: string): string {
  return BLURBS[id] ?? `${fallbackName} is a drink you made yourself. Open Make Edits to change what is in it.`;
}
