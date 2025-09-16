import moment from "moment";
import Campaign from "../../models/Campaign";
import AppError from "../../errors/AppError";

interface RecurrenceConfig {
  type: string;
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

class RecurrenceService {
  static calculateNextExecution(
    lastExecution: Date,
    config: RecurrenceConfig
  ): Date {
    const lastMoment = moment(lastExecution);
    let nextExecution: moment.Moment;

    switch (config.type) {
      case 'daily':
        nextExecution = lastMoment.clone().add(config.interval, 'days');
        break;

      case 'weekly':
        if (!config.daysOfWeek || config.daysOfWeek.length === 0) {
          nextExecution = lastMoment.clone().add(config.interval, 'weeks');
        } else {
          nextExecution = this.calculateNextWeeklyExecution(lastMoment, config);
        }
        break;

      case 'biweekly':
        nextExecution = lastMoment.clone().add(config.interval * 2, 'weeks');
        break;

      case 'monthly':
        if (config.dayOfMonth) {
          nextExecution = this.calculateNextMonthlyExecution(lastMoment, config);
        } else {
          nextExecution = lastMoment.clone().add(config.interval, 'months');
        }
        break;

      case 'yearly':
        nextExecution = lastMoment.clone().add(config.interval, 'years');
        break;

      default:
        throw new AppError('Tipo de recorrência inválido', 400);
    }

    return nextExecution.toDate();
  }

  private static calculateNextWeeklyExecution(
    lastMoment: moment.Moment,
    config: RecurrenceConfig
  ): moment.Moment {
    const daysOfWeek = config.daysOfWeek!.sort();
    const currentDayOfWeek = lastMoment.day();
    
    // Encontrar próximo dia da semana
    let nextDay = daysOfWeek.find(day => day > currentDayOfWeek);
    
    if (nextDay !== undefined) {
      // Próximo dia na mesma semana
      return lastMoment.clone().day(nextDay);
    } else {
      // Primeiro dia da próxima semana do ciclo
      const weeksToAdd = config.interval;
      return lastMoment.clone()
        .add(weeksToAdd, 'weeks')
        .day(daysOfWeek[0]);
    }
  }

  private static calculateNextMonthlyExecution(
    lastMoment: moment.Moment,
    config: RecurrenceConfig
  ): moment.Moment {
    let nextExecution = lastMoment.clone().add(config.interval, 'months');
    
    // Ajustar para o dia específico do mês
    nextExecution.date(config.dayOfMonth!);
    
    // Se o dia não existe no mês, usar o último dia do mês
    if (nextExecution.date() !== config.dayOfMonth) {
      nextExecution = nextExecution.endOf('month');
    }
    
    return nextExecution;
  }

  static shouldContinueRecurrence(campaign: Campaign): boolean {
    const now = new Date();
    
    // Verificar data limite
    if (campaign.recurrenceEndDate && now > campaign.recurrenceEndDate) {
      return false;
    }
    
    // Verificar número máximo de execuções
    if (campaign.maxExecutions && campaign.executionCount >= campaign.maxExecutions) {
      return false;
    }
    
    return true;
  }

  static async scheduleNextExecution(campaignId: number): Promise<void> {
    const campaign = await Campaign.findByPk(campaignId);
    
    if (!campaign || !campaign.isRecurring) {
      return;
    }

    if (!this.shouldContinueRecurrence(campaign)) {
      await campaign.update({ 
        status: 'FINALIZADA',
        nextScheduledAt: null 
      });
      return;
    }

    const config: RecurrenceConfig = {
      type: campaign.recurrenceType,
      interval: campaign.recurrenceInterval,
      daysOfWeek: campaign.recurrenceDaysOfWeek ? 
        JSON.parse(campaign.recurrenceDaysOfWeek) : undefined,
      dayOfMonth: campaign.recurrenceDayOfMonth
    };

    const lastExecution = campaign.lastExecutedAt || campaign.scheduledAt;
    const nextExecution = this.calculateNextExecution(lastExecution, config);

    await campaign.update({
      nextScheduledAt: nextExecution,
      status: 'PROGRAMADA'
    });
  }
}

export default RecurrenceService;