/**
 * The paragraph under a drink's name in Browse mode (Figma 256:832).
 *
 * OPEN: only the Negroni's text comes from JP's design. The others are first-pass copy for JP to
 * rewrite. They describe how each drink tastes and why it works, and avoid dates and origin stories
 * I can't be sure of.
 */
export const BLURBS: Record<string, string> = {
  negroni:
    "The Negroni is widely believed to have originated in Florence in 1919, when Count Camillo Negroni asked bartender Fosco Scarselli at Caffè Casoni to strengthen his usual Americano by replacing its soda water with gin. Scarselli reportedly added an orange garnish instead of lemon, distinguishing the new drink. Made with equal parts gin, Campari, and sweet vermouth, the Negroni became a staple of Italian aperitivo culture before gaining worldwide popularity. Though its precise origins remain debated, its bittersweet balance and simple recipe have made it one of the world’s most enduring classic cocktails.",
  gimlet:
    "Gin, lime and a little sugar, and nothing else to hide behind. The Gimlet is a sour in its simplest form: sharp first, then soft, with the gin’s botanicals running underneath. It is a good drink to learn from, because every change you make to it shows.",
  daiquiri:
    "White rum, lime and sugar, shaken until cold. The Daiquiri is the template for the whole sour family: a strong base, something sharp, something sweet, in balance. Add a little more lime and it turns lean and bright; add a little more sugar and it turns round and easy.",
  "whiskey-sour":
    "Bourbon’s caramel and vanilla, lifted by lemon and softened with syrup. The Whiskey Sour is warmer and rounder than the other sours, because the base has so much flavor of its own. The cherry on top is not just for show: it adds a last note of dark fruit.",
  margarita:
    "Tequila, orange liqueur and lime, with salt around the rim. The salt makes the sour taste brighter and the agave taste sweeter, so each sip lands a little differently from the last. It is crisp, citrusy and made for company.",
  cosmopolitan:
    "Vodka, orange liqueur, cranberry and lime. The Cosmopolitan is tart rather than sweet, with a pink color that comes from the cranberry and a clean finish from the vodka. It is the modern sour: light, fruity and quick to drink.",
  "tom-collins":
    "A gin sour stretched with soda water until it is tall and fizzy. Lemon and a touch of sugar keep it bright, and the soda makes it light enough to drink slowly on a warm afternoon. If a Gimlet is a short sharp sip, this is the same idea given room to breathe.",
  mojito:
    "White rum, lime, sugar, mint and soda. The mint is pressed so its oils come out, which is where most of the smell comes from. It is cool, green and sweet-sour, and one of the most refreshing drinks you can make at home.",
  "old-fashioned":
    "Whiskey, a little sugar and bitters, stirred over ice. That is the whole recipe, which is why the choice of whiskey matters so much. The bitters add spice and depth, and the orange peel adds a bright oil that you smell before you taste.",
  manhattan:
    "Rye whiskey and sweet vermouth, finished with bitters and a cherry. The rye brings spice, the vermouth brings dark sweetness, and the bitters tie them together. It is stirred rather than shaken, so it stays clear and silky.",
  martini:
    "Gin and dry vermouth, stirred cold and served without ice. The Martini is a drink of very few parts, so the proportions and the temperature do most of the work. The lemon twist adds a bright oil over the top.",
  "gin-and-tonic":
    "Gin, tonic water and a squeeze of lime over ice. The quinine in the tonic gives it a dry bitterness that plays against the gin’s botanicals. It is simple, long and refreshing, and very easy to tune to your taste.",
  "moscow-mule":
    "Vodka, lime and ginger beer, built right in the glass. The ginger gives it heat and the lime keeps it sharp, so it tastes lively and a little spicy rather than sweet. It is a good first drink for anyone who likes ginger.",
  "aperol-spritz":
    "Prosecco, Aperol and a splash of soda, with a slice of orange. It is light, bittersweet and low in alcohol, built for the hour before dinner. The orange color is part of the point: it looks as good as it tastes.",
  "hot-toddy":
    "Whiskey, honey and lemon in hot water, with a cinnamon stick. It is a warm drink for a cold evening: the honey softens the whiskey, the lemon keeps it from being heavy, and the steam carries the cinnamon.",
  "arnold-palmer":
    "Iced tea and lemonade in equal parts. It has no alcohol and is easy to like: the tea adds a little tannic bite and the lemonade adds sweetness and sharpness. It is also a good example of how two drinks can make a third.",
  "shirley-temple":
    "Ginger ale with a little grenadine and a cherry. It is sweet, fizzy and bright red, and has no alcohol. It is a classic for a reason: it is built just like a cocktail, with a base, a sweetener and a garnish.",
  "espresso-martini":
    "Vodka, coffee liqueur and fresh espresso, shaken hard until a foam forms on top. It tastes like dark roast and cream-less dessert, with enough alcohol to keep it from being just coffee. The three coffee beans on the foam are the traditional finish.",
};

/** The Browse paragraph for a drink; saved drinks and anything without copy get a plain line. */
export function blurbFor(id: string, fallbackName: string): string {
  return BLURBS[id] ?? `${fallbackName} is a drink you made yourself. Open Make Edits to change what is in it.`;
}
