import { Chat, configuration, secrets } from '@botpress/runtime'
import { checkBotControl } from './control-policy'

export async function canBotReply(conversationId: string): Promise<boolean> {
  return checkBotControl(configuration.crmApiBaseUrl || 'https://crm-adara.vercel.app', secrets.CRM_WEBHOOK_SECRET, conversationId)
}

// Recheck each outgoing message, including a generation already underway when the
// operator pauses. A message already accepted by the channel cannot be recalled.
export class ControlledChat extends Chat {
  private controlledConversationId: string
  constructor(context: ConstructorParameters<typeof Chat>[0]) {
    super(context)
    this.controlledConversationId = context.conversation?.id || ''
  }
  override async sendMessage(message: Parameters<Chat['sendMessage']>[0]) {
    if (!this.controlledConversationId || !(await canBotReply(this.controlledConversationId))) {
      throw new Error('CRM: automatic reply paused or control unavailable')
    }
    return super.sendMessage(message)
  }
}
