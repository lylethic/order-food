import z from 'zod';

export const dashboardStatisticsSchema = z.object({
  tasks: z.object({
    total_tasks: z.number().default(0),
    by_status: z.array(
      z.object({
        status: z.string(),
        count: z.number().default(0),
      }),
    ),
    overdue_tasks: z.number().default(0),
    completed_on_time: z.number().default(0),
    completed_late: z.number().default(0),
    avg_completion_days: z.number().default(0),
  }),
  attendance: z.object({
    total_checkins: z.number().default(0),
    valid_checkins: z.number().default(0),
    invalid_checkins: z.number().default(0),
    valid_rate: z.number().default(0),
    unique_users: z.number().default(0),
    daily_trend: z.array(z.object({})),
  }),
  work_schedule: z.object({
    total_schedules: z.number().default(0),
    total_interns: z.number().default(0),
    total_mentors: z.number().default(0),
    day_distribution: z.object({
      monday: z.number().default(0),
      tuesday: z.number().default(0),
      wednesday: z.number().default(0),
      thursday: z.number().default(0),
      friday: z.number().default(0),
    }),
  }),
});

export type DashboardStatisticsSchemaType = z.TypeOf<
  typeof dashboardStatisticsSchema
>;
