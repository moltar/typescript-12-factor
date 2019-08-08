import { Config } from "./config"

const configFactory = () => new Config({
  HOME: '/',
  DESTROY_DATABASE: 'true',
  COUNT: '1'
})

describe(Config.name, () => {
  it('newing should throw when values are not provided', () => {
    expect(() => new Config()).toThrow()
  })

  it('should accept values in constructor', () => {
    const config = configFactory()
    expect(config).toBeInstanceOf(Config)
  });

  it('should correctly parse the inputs', () => {
    const config = configFactory()

    expect(typeof config.HOME).toBe('string')
    expect(config.HOME).toBe('/')

    expect(typeof config.DESTROY_DATABASE).toBe('boolean')
    expect(config.DESTROY_DATABASE).toBe(true)

    expect(typeof config.COUNT).toBe('number')
    expect(config.COUNT).toBe(1)
  });

  it('should protect values from writing', () => {
    const config = configFactory()
    expect(() => {
      // @ts-ignore
      config.COUNT = 2
    }).toThrowError(/Cannot assign to read only property/)
  });
})
