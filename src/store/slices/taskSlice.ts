import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { taskService } from '../../services/taskService';
import { Priority, TaskStatus, TaskTimerStatus, TaskType } from '../../utils/enums/task';
import { RootState } from '..';

export interface IAttachment {
  imageName: string;
  imageId: string;
  url: string;
  _id: string;
}

interface ILabels {
  _id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  boardId: string;
}

interface TimerSession {
  start_time: string;
  end_time: string;
  duration: number;
  _id: string;
}

export interface ITask {
  _id: string;
  title: string;
  description: string;
  board_id: string;
  created_by: string;
  priority?: Priority;
  task_type?: TaskType;
  status?: string;
  attachment: IAttachment[];
  labels: ILabels[];
  comments: number;
  start_date: string | null;
  end_date: string | null;
  status_list_id: {
    _id: string;
    name: string;
    description: string;
    board_id: {
      _id: string;
      name: string;
      description: string;
    };
  };
  members: number;
  position?: number;
  assigned_to: {
    _id: string;
    first_name: string;
    last_name: string;
  } | null;
  total_estimated_time: number;
  actual_time_spent: number;
  timer_start_time: any;
  is_timer_active: boolean;
  timer_status: TaskTimerStatus;
  timer_sessions: TimerSession[];
  estimated_hours: number;
  estimated_minutes: number;
  current_elapsed: number;
  total_current_time: number;
}

interface TaskState {
  tasksByStatus: { [statusId: string]: ITask[] };
  selectedTask: ITask | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

const initialState: TaskState = {
  tasksByStatus: {},
  selectedTask: null,
  loading: false,
  error: null,
  success: null,
};

export const getTasksByStatusId = createAsyncThunk(
  'task/get-tasks-by-status',
  async (
    data: {
      statusId: string;
      filter: {
        filterBy: string[];
        labelIds?: string[];
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await taskService.getTasksByStatusId(data.statusId, data.filter);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Error while fetching tasks.');
    }
  }
);

export const createTask = createAsyncThunk(
  'task/create',
  async (
    {
      title,
      board_id,
      status_list_id,
    }: {
      title: string;
      board_id: string;
      status_list_id: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await taskService.createTask(title, board_id, status_list_id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Error while creating task.');
    }
  }
);

export const updateTask = createAsyncThunk(
  'task/update',
  async (
    data: {
      taskId: string;
      title?: string;
      status_list_id?: string;
      newPosition?: number;
      status?: string;
      description?: string;
      priority?: Priority;
      end_date?: string | null;
      task_type?: TaskType;
    },
    { rejectWithValue, getState, dispatch }
  ) => {
    try {
      const response = await taskService.updateTask(data);

      const state = getState() as RootState;
      const statuses = state.status.statusList;
      const statusList = statuses.find((status) => status._id === data.status_list_id && status.name.toLowerCase().includes('complete'));
      const statusFinal = !!statusList;
      let newStatus: TaskStatus;
      if (data.status_list_id) {
        const state = getState() as RootState;
        const statuses = state.status.statusList;
        const statusList = statuses.find(
          (status) => status._id === data.status_list_id && status.name.toLowerCase().includes('complete')
        );
        newStatus = statusList ? TaskStatus.COMPLETED : TaskStatus.INCOMPLETE;
      } else {
        newStatus = (data.status as TaskStatus) ?? TaskStatus.INCOMPLETE;
      }
      await dispatch(
        updateTaskStatusOnly({
          taskId: data.taskId,
          status: newStatus,
        })
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Error while updating task.');
    }
  }
);

export const updateTaskStatusOnly = createAsyncThunk(
  'task/update/status-only',
  async (
    data: {
      taskId: string;
      status?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await taskService.updateTask(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Error while updating task.');
    }
  }
);

export const deleteTask = createAsyncThunk('task/delete', async (taskId: string, { rejectWithValue }) => {
  try {
    const response = await taskService.deleteTask(taskId);
    return { taskId, ...response };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message ?? 'Error while deleting task.');
  }
});

export const getTaskById = createAsyncThunk('task/get-by-id', async (taskId: string, { rejectWithValue }) => {
  try {
    const response = await taskService.getTaskById(taskId);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message ?? 'Error while fetching task.');
  }
});

export const assignMember = createAsyncThunk(
  'task/assign-member-in-task',
  async (
    {
      task_id,
      member_id,
    }: {
      task_id: string;
      member_id: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await taskService.assignMember(task_id, member_id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Error while assigning member.');
    }
  }
);

export const recurringTask = createAsyncThunk(
  'task/repeat-task',
  async (
    {
      taskId,
      repeat_type,
      start_date,
      end_date,
    }: {
      taskId: string;
      repeat_type: string;
      start_date: string;
      end_date: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await taskService.recurringTask(taskId, repeat_type, start_date, end_date);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Error while assigning member.');
    }
  }
);

export const unassignMember = createAsyncThunk('task/unassign-member-from-task', async ({ taskId }: { taskId: string }, { rejectWithValue }) => {
  try {
    const response = await taskService.unassignMember(taskId);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message ?? 'Error while unassigning member.');
  }
});

export const addEstimatedTime = createAsyncThunk(
  'timer/add-estimated-time',
  async (
    {
      taskId,
      hours,
      minutes,
    }: {
      taskId: string;
      hours: number;
      minutes: number;
    },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      const response = await taskService.addEstimatedTime(taskId, hours, minutes);
      // Access the Redux state using getState()
      const state = getState() as { task: TaskState };
      const selectedTask = state.task.selectedTask;
      const statusId =
        selectedTask && typeof selectedTask.status_list_id === 'object' ? selectedTask.status_list_id._id : selectedTask?.status_list_id;

      if (statusId) {
        dispatch(
          taskSlice.actions.timerCount({
            task_id: taskId,
            status_list_id: statusId,
            hours,
            minutes,
          })
        );
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Error while assigning member.');
    }
  }
);

export const startTimer = createAsyncThunk('timer/start-timer', async ({ taskId }: { taskId: string }, { rejectWithValue, dispatch, getState }) => {
  try {
    const response = await taskService.startTimer(taskId);
    // Access the Redux state using getState()
    const state = getState() as { task: TaskState };
    const selectedTask = state.task.selectedTask;
    const statusId = selectedTask && typeof selectedTask.status_list_id === 'object' ? selectedTask.status_list_id._id : selectedTask?.status_list_id;

    if (statusId) {
      dispatch(
        taskSlice.actions.timerCount({
          task_id: taskId,
          status_list_id: statusId,
          is_timer_active: true,
          startTime: response.data.startTime,
        })
      );
    }
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message ?? 'Error while start timer.';
    if (message.includes('You already have an active timer running.')) {
      const link = `${window.location}?task_id=${error.response?.data?.data?.taskId}`;
      return rejectWithValue(`${message}\nLink: ${link}`);
    }
    return rejectWithValue(message);
  }
});

export const stopTimer = createAsyncThunk('timer/stop-timer', async ({ taskId }: { taskId: string }, { rejectWithValue, getState, dispatch }) => {
  try {
    const response = await taskService.stopTimer(taskId);
    // Access the Redux state using getState()
    const state = getState() as { task: TaskState };
    const selectedTask = state.task.selectedTask;
    const statusId = selectedTask && typeof selectedTask.status_list_id === 'object' ? selectedTask.status_list_id._id : selectedTask?.status_list_id;

    if (statusId) {
      dispatch(
        taskSlice.actions.timerCount({
          task_id: taskId,
          status_list_id: statusId,
          is_timer_active: false,
          actualTimeSpent: response.data.totalTimeSpent,
        })
      );
    }
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message ?? 'Error while stop timer.');
  }
});

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    addNewTask: (state, action) => {
      const statusListId = action.payload.data.status_list_id._id ?? action.payload.data.status_list_id;
      if (!state.tasksByStatus[statusListId]) {
        state.tasksByStatus[statusListId] = [];
      }
      state.tasksByStatus[statusListId].push(action.payload.data);
    },
    removeTask: (state, action) => {
      const statusListId = action.payload.data.status_list_id;
      if (!state.tasksByStatus[statusListId]) {
        state.tasksByStatus[statusListId] = [];
      }
      state.tasksByStatus[statusListId] = state.tasksByStatus[statusListId].filter((task) => task._id !== action.payload.data._id);
    },
    clearTaskState: (state) => {
      state.tasksByStatus = {};
      state.selectedTask = null;
      state.loading = false;
      state.error = null;
      state.success = null;
    },
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
    },
    clearSelectedTask: (state) => {
      state.selectedTask = null;
    },
    updateTaskPosition: (state, action) => {
      const task = action.payload.data;
      const taskId = task._id;
      const newPosition = task.position;
      const status_list_id = task.status_list_id;

      let sourceStatusId = '';
      let taskIndex = -1;
      Object.entries(state.tasksByStatus).forEach(([statusId, tasks]) => {
        const index = tasks.findIndex((t) => t._id === taskId);
        if (index !== -1) {
          sourceStatusId = statusId;
          taskIndex = index;
        }
      });

      if (taskIndex === -1) return; // Task not found
      const taskToMove = { ...state.tasksByStatus[sourceStatusId][taskIndex] };
      state.tasksByStatus[sourceStatusId].splice(taskIndex, 1);

      if (status_list_id && status_list_id !== sourceStatusId) {
        if (!state.tasksByStatus[status_list_id]) {
          state.tasksByStatus[status_list_id] = [];
        }

        if (typeof taskToMove.status_list_id === 'object') {
          taskToMove.status_list_id._id = status_list_id;
        } else {
          taskToMove.status_list_id = status_list_id;
        }

        taskToMove.position = newPosition;
        const destInsertIndex = Math.min(Math.max(0, newPosition - 1), state.tasksByStatus[status_list_id].length);
        state.tasksByStatus[status_list_id].splice(destInsertIndex, 0, taskToMove);
      } else {
        taskToMove.position = newPosition;
        const insertIndex = Math.min(Math.max(0, newPosition - 1), state.tasksByStatus[sourceStatusId].length);
        state.tasksByStatus[sourceStatusId].splice(insertIndex, 0, taskToMove);
      }
    },
    updateTaskInState: (state, action) => {
      const updatedTask = action.payload.data;
      const taskId = updatedTask._id;
      for (const statusId in state.tasksByStatus) {
        const taskIndex = state.tasksByStatus[statusId].findIndex((task) => task._id === taskId);

        if (taskIndex !== -1) {
          if (updatedTask.status_list_id && updatedTask.status_list_id !== statusId) {
            const taskToUpdate = {
              ...state.tasksByStatus[statusId][taskIndex],
            };
            state.tasksByStatus[statusId].splice(taskIndex, 1);
            const newStatusId = updatedTask.status_list_id;

            if (!state.tasksByStatus[newStatusId]) {
              state.tasksByStatus[newStatusId] = [];
            }
            if (updatedTask.title !== undefined) {
              taskToUpdate.title = updatedTask.title;
            }
            if (updatedTask.description !== undefined) {
              taskToUpdate.description = updatedTask.description;
            }
            if (updatedTask.priority !== undefined) {
              taskToUpdate.priority = updatedTask.priority;
            }
            if (updatedTask.assigned_to !== undefined) {
              taskToUpdate.assigned_to = updatedTask.assigned_to;
            }
            if (updatedTask.status !== undefined) {
              taskToUpdate.status = updatedTask.status;
            }
            if (updatedTask.end_date !== undefined) {
              taskToUpdate.end_date = updatedTask.end_date;
            }
            if (typeof updatedTask.status_list_id === 'object') {
              taskToUpdate.status_list_id = updatedTask.status_list_id;
            } else if (typeof taskToUpdate.status_list_id === 'object') {
              taskToUpdate.status_list_id._id = newStatusId;
            } else {
              taskToUpdate.status_list_id = { _id: newStatusId } as any;
            }
            // Add to new status list
            state.tasksByStatus[newStatusId].push(taskToUpdate);
          } else {
            const task = state.tasksByStatus[statusId][taskIndex];

            if (updatedTask.title !== undefined) {
              task.title = updatedTask.title;
            }
            if (updatedTask.description !== undefined) {
              task.description = updatedTask.description;
            }
            if (updatedTask.priority !== undefined) {
              task.priority = updatedTask.priority;
            }
            if (updatedTask.assigned_to !== undefined) {
              task.assigned_to = updatedTask.assigned_to;
            }
            if (updatedTask.status !== undefined) {
              task.status = updatedTask.status;
            }
            if (updatedTask.end_date !== undefined) {
              task.end_date = updatedTask.end_date;
            }
          }
          if (state.selectedTask && state.selectedTask._id === taskId) {
            if (updatedTask.title !== undefined) {
              state.selectedTask.title = updatedTask.title;
            }
            if (updatedTask.description !== undefined) {
              state.selectedTask.description = updatedTask.description;
            }
            if (updatedTask.priority !== undefined) {
              state.selectedTask.priority = updatedTask.priority;
            }
            if (updatedTask.assigned_to !== undefined) {
              state.selectedTask.assigned_to = updatedTask.assigned_to;
            }
            if (updatedTask.status !== undefined) {
              state.selectedTask.status = updatedTask.status;
            }
            if (updatedTask.end_date !== undefined) {
              state.selectedTask.end_date = updatedTask.end_date;
            }
            if (updatedTask.status_list_id !== undefined) {
              if (typeof updatedTask.status_list_id === 'object') {
                state.selectedTask.status_list_id = updatedTask.status_list_id;
              } else if (typeof state.selectedTask.status_list_id === 'object') {
                state.selectedTask.status_list_id._id = updatedTask.status_list_id;
              }
            }
          }

          break;
        }
      }
    },
    updateTaskLabel: (state, action) => {
      const { _id, status_list_id } = action.payload.task_id;
      const updatedTasks = state.tasksByStatus[status_list_id].map((task) => {
        return task._id === _id
          ? {
              ...task,
              labels: [...task.labels, action.payload.label_id],
            }
          : task;
      });
      state.tasksByStatus = {
        ...state.tasksByStatus,
        [status_list_id]: updatedTasks,
      };
    },
    addLabelToTask: (state, action) => {
      const { label_id, task_id, status_list_id } = action.payload;
      const task = state.tasksByStatus[status_list_id]?.find((t) => t._id === task_id);
      if (task) {
        const exists = task?.labels?.some((l) => l._id === label_id._id);
        if (!exists) {
          task.labels.push(label_id);
        }
      }
    },
    removeLabelToTask: (state, action) => {
      const { label_id, task_id, status_list_id } = action.payload;

      const task = state.tasksByStatus[status_list_id]?.find((t) => t._id === task_id);
      if (task) {
        task.labels = task.labels.filter((label) => label._id !== label_id);
      }
    },
    removeTaskLabel: (state, action) => {
      const { label_id, task_id } = action.payload;
      if (state.selectedTask) {
        const updatedTasks = state.tasksByStatus[state.selectedTask?.status_list_id._id].map((task) => {
          const updatedLabels = task.labels.filter((label) => label._id !== label_id);
          return task._id === task_id
            ? {
                ...task,
                labels: updatedLabels,
              }
            : task;
        });
        state.tasksByStatus = {
          ...state.tasksByStatus,
          [state.selectedTask?.status_list_id._id]: updatedTasks,
        };
      }
    },
    updateTaskAttachment: (state, action) => {
      const { _id, status_list_id } = action.payload;
      const updatedTasks = state.tasksByStatus[status_list_id].map((task) => {
        return task._id === _id
          ? {
              ...task,
              attachment: action.payload.attachment,
            }
          : task;
      });
      state.tasksByStatus = {
        ...state.tasksByStatus,
        [status_list_id]: updatedTasks,
      };
      state.selectedTask = {
        ...state.selectedTask,
        attachment: action.payload.attachment,
      } as ITask;
    },
    updateTaskComments: (state, action) => {
      const { _id, status_list_id } = action.payload.task_id;
      const updatedTasks = state.tasksByStatus[status_list_id].map((task) => {
        return task._id === _id
          ? {
              ...task,
              comments: task.comments + 1,
            }
          : task;
      });
      state.tasksByStatus = {
        ...state.tasksByStatus,
        [status_list_id]: updatedTasks,
      };
    },
    removeTaskComments: (state, action) => {
      const { task_id } = action.payload;
      if (state.selectedTask) {
        const updatedTasks = state.tasksByStatus[state.selectedTask.status_list_id._id].map((task) => {
          return task._id === task_id
            ? {
                ...task,
                comments: task.comments - 1,
              }
            : task;
        });
        state.tasksByStatus = {
          ...state.tasksByStatus,
          [state.selectedTask.status_list_id._id]: updatedTasks,
        };
      }
    },
    assignTaskMember: (state, action) => {
      state.selectedTask = {
        ...state.selectedTask,
        assigned_to: action.payload.data.assigned_to,
      } as ITask;
    },
    unassignTaskMember: (state) => {
      state.selectedTask = {
        ...state.selectedTask,
        assigned_to: null,
      } as ITask;
    },
    addAssignMemberToTask: (state, action) => {
      const { status_list_id, task_id, assigned_to } = action.payload.data;

      const task = state.tasksByStatus[status_list_id]?.find((t) => t._id === task_id);

      if (task) {
        task.assigned_to = assigned_to;
      }
    },
    removeAssignMemberTask: (state, action) => {
      const { status_list_id, task_id } = action.payload.data;
      const task = state.tasksByStatus[status_list_id]?.find((t) => t._id === task_id);

      if (task) {
        task.assigned_to = null;
      }
    },
    updateSocketTask: (state, action) => {
      const { data } = action.payload;
      const { _id, status_list_id } = data;
      const task = state.tasksByStatus[status_list_id]?.find((t) => t._id === _id);
      if (task) {
        Object.assign(task, data);
      }
    },
    updateCommentCount: (state, action) => {
      const { task_id } = action.payload.payload.data;

      const { _id, status_list_id } = task_id;
      const task = state.tasksByStatus[status_list_id]?.find((t) => t._id === _id);
      if (task) {
        task.comments = action.payload.dataScript === 'add' ? task.comments + 1 : task.comments - 1;
      }
    },
    updateAttachmentCount: (state, action) => {
      const { _id, status_list_id, attachment } = action.payload.data;

      const task = state.tasksByStatus[status_list_id]?.find((t) => t._id === _id);
      if (task) {
        task.attachment = attachment;
      }
    },
    timerCount: (state, action) => {
      const { task_id, status_list_id, is_timer_active, startTime, actualTimeSpent, hours, minutes } = action.payload;
      const task = state.tasksByStatus[status_list_id]?.find((t) => t._id == task_id);
      if (task) {
        task.is_timer_active = is_timer_active;
        task.actual_time_spent = actualTimeSpent ? actualTimeSpent : task.actual_time_spent;
        if (startTime) {
          task.timer_start_time = startTime ? startTime : null;
        }
        if (hours && minutes) {
          task.estimated_hours = hours;
          task.estimated_minutes = minutes;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get tasks by status
      .addCase(getTasksByStatusId.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(getTasksByStatusId.fulfilled, (state, action) => {
        const data = action.meta.arg;
        state.tasksByStatus[data.statusId] = action.payload;
        state.loading = false;
        state.error = null;
        state.success = 'Tasks fetched successfully.';
      })
      .addCase(getTasksByStatusId.rejected, (state, action) => {
        state.loading = false;
        state.success = null;
        state.error = (action.payload as string) || 'Error while fetching tasks.';
      })

      // Create task
      .addCase(createTask.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        const newTask = action.payload.data;
        const statusId = newTask.status_list_id._id;
        if (!state.tasksByStatus[statusId]) {
          state.tasksByStatus[statusId] = [];
        }
        state.tasksByStatus[statusId].push(newTask);
        state.loading = false;
        state.error = null;
        state.success = 'Task created successfully.';
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.success = null;
        state.error = (action.payload as string) || 'Error while creating task.';
      })

      // Update task
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.selectedTask = action.payload;
        state.success = 'Task updated successfully.';
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.success = null;
        state.error = (action.payload as string) || 'Error while updating task.';
      })

      // Update task
      .addCase(updateTaskStatusOnly.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateTaskStatusOnly.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.selectedTask = action.payload;
        state.success = 'Task updated successfully.';
      })
      .addCase(updateTaskStatusOnly.rejected, (state, action) => {
        state.loading = false;
        state.success = null;
        state.error = (action.payload as string) || 'Error while updating task.';
      })

      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        const { taskId } = action.payload;

        // Remove from tasksByStatus map
        for (const statusId in state.tasksByStatus) {
          state.tasksByStatus[statusId] = state.tasksByStatus[statusId].filter((task) => task._id !== taskId);
        }
        if (state.selectedTask && state.selectedTask._id === taskId) {
          state.selectedTask = null;
        }
        state.loading = false;
        state.error = null;
        state.success = 'Task deleted successfully.';
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.success = null;
        state.error = (action.payload as string) || 'Error while deleting task.';
      })

      // Get task by ID
      .addCase(getTaskById.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(getTaskById.fulfilled, (state, action) => {
        state.selectedTask = action.payload;
        state.loading = false;
        state.error = null;
        state.success = 'Task fetched successfully.';
      })
      .addCase(getTaskById.rejected, (state, action) => {
        state.loading = false;
        state.selectedTask = null;
        state.success = null;
        state.error = (action.payload as string) || 'Error while fetching task.';
      })

      // Assign member into task
      .addCase(assignMember.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(assignMember.fulfilled, (state, action) => {
        state.selectedTask = {
          ...state.selectedTask,
          assigned_to: action.payload.data.assigned_to,
        } as ITask;
        state.loading = false;
        state.error = null;
        state.success = 'Member assigned successfully.';
      })
      .addCase(assignMember.rejected, (state, action) => {
        state.loading = false;
        state.success = null;
        state.error = (action.payload as string) || 'Error while assigning member.';
      })

      //create recurring task
      .addCase(recurringTask.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(recurringTask.fulfilled, (state, action) => {
        state.selectedTask = action.payload.data as ITask;
        state.loading = false;
        state.error = null;
        state.success = 'Follow up task created successfully.';
      })
      .addCase(recurringTask.rejected, (state, action) => {
        state.loading = false;
        state.success = null;
        state.error = (action.payload as string) || 'Error while creating followup task.';
      })

      // Unassign member from task
      .addCase(unassignMember.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(unassignMember.fulfilled, (state) => {
        state.selectedTask = {
          ...state.selectedTask,
          assigned_to: null,
        } as ITask;
        state.loading = false;
        state.error = null;
        state.success = 'Member unassigned successfully.';
      })
      .addCase(unassignMember.rejected, (state, action) => {
        state.loading = false;
        state.success = null;
        state.error = (action.payload as string) || 'Error while unassigning member.';
      })

      // Add estimate time into task
      .addCase(addEstimatedTime.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(addEstimatedTime.fulfilled, (state, action) => {
        state.selectedTask = {
          ...state.selectedTask,
          timer_start_time: action.payload.timer_start_time,
          actual_time_spent: action.payload.actual_time_spent,
          total_estimated_time: action.payload.total_estimated_time,
          timer_status: action.payload.timer_status,
          is_timer_active: action.payload.is_timer_active,
          timer_sessions: action.payload.timer_sessions,
          estimated_hours: action.payload.estimated_hours,
          estimated_minutes: action.payload.estimated_minutes,
        } as ITask;
        state.loading = false;
        state.error = null;
      })
      .addCase(addEstimatedTime.rejected, (state, action) => {
        state.loading = false;
        state.success = null;
        state.error = (action.payload as string) || 'Error while adding estimate time.';
      })

      // start timer into task
      .addCase(startTimer.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(startTimer.fulfilled, (state, action) => {
        state.selectedTask = {
          ...state.selectedTask,
          total_estimated_time: action.payload.totalEstimatedTime,
          timer_status: TaskTimerStatus.IN_PROGRESS,
          is_timer_active: true,
        } as ITask;
        state.loading = false;
        state.error = null;
      })
      .addCase(startTimer.rejected, (state, action) => {
        state.loading = false;
        state.success = null;
        state.error = (action.payload as string) || 'Error while starting timer.';
      })

      // stop timer into task
      .addCase(stopTimer.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(stopTimer.fulfilled, (state, action) => {
        state.selectedTask = {
          ...state.selectedTask,
          timer_status: action.payload.status,
          actual_time_spent: action.payload.totalTimeSpent,
          is_timer_active: false,
        } as ITask;
        state.loading = false;
        state.error = null;
      })
      .addCase(stopTimer.rejected, (state, action) => {
        state.loading = false;
        state.success = null;
        state.error = (action.payload as string) || 'Error while stopping timer.';
      });
  },
});

export const {
  addNewTask,
  removeTask,
  clearTaskState,
  setSelectedTask,
  clearSelectedTask,
  updateTaskPosition,
  updateTaskInState,
  updateTaskLabel,
  removeTaskLabel,
  updateTaskAttachment,
  updateTaskComments,
  removeTaskComments,
  assignTaskMember,
  unassignTaskMember,
  addLabelToTask,
  removeLabelToTask,
  addAssignMemberToTask,
  removeAssignMemberTask,
  updateSocketTask,
  updateCommentCount,
  updateAttachmentCount,
  timerCount,
} = taskSlice.actions;

export default taskSlice.reducer;
