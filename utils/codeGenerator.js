const EventCodeGenerator = (number) => {
     const numberOfCodes = number 
     const codes = new Set();
     const characters = '0123456789'
     const originalSize = codes.size;

     while (codes.size < originalSize + numberOfCodes) {
          const code = Array.from({ length: 5 }, () =>
               characters[Math.floor(Math.random() * characters.length)]
          ).join('')

          codes.add(code)
     }

     return [...codes]
}

module.exports = { EventCodeGenerator }