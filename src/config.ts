import { from } from 'env-var'

export class Config {
  public constructor(private processEnv = process.env) {
    Object.freeze(this)
  }

  private env = from(this.processEnv)

  public readonly HOME = this.env.get('HOME').required().asString()

  public readonly DESTROY_DATABASE = this.env.get('DESTROY_DATABASE').required().asBool()

  public readonly COUNT = this.env.get('COUNT').required().asIntPositive()
}
