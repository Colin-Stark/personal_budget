#!/bin/bash
input=$(cat)
extract() {
    echo "$input" | jq -r "$1 // empty"
}

model_name=$(extract '.model.display_name')
cwd=$(extract '.workspace.current_dir')
style=$(extract '.output_style.name')
session_name=$(extract '.session_name')
vim_mode=$(extract '.vim.mode')
effort=$(extract '.effort.level')
thinking=$(extract '.thinking.enabled')
repo=$(extract '.workspace.repo | if . then .owner + "/" + .name else empty end')
pr_num=$(extract '.pr.number')
pr_state=$(extract '.pr.review_state // "open"')
agent_name=$(extract '.agent.name')
agent_type=$(extract '.agent.type')
worktree_name=$(extract '.worktree.name')
worktree_branch=$(extract '.worktree.branch')
worktree_original_cwd=$(extract '.worktree.original_cwd')
project_dir=$(extract '.workspace.project_dir')
git_branch=$(extract '.workspace.git_branch // empty')
version=$(extract '.version')
ctx_used=$(extract '.context_window.used_percentage')
ctx_remaining=$(extract '.context_window.remaining_percentage')
ctx_size=$(extract '.context_window.context_window_size')
current_usage=$(extract '.context_window.current_usage')
input_tokens=$(extract '.context_window.current_usage.input_tokens')
output_tokens=$(extract '.context_window.current_usage.output_tokens')
cache_create=$(extract '.context_window.current_usage.cache_creation_input_tokens')
cache_read=$(extract '.context_window.current_usage.cache_read_input_tokens')
five_hour_pct=$(extract '.rate_limits.five_hour.used_percentage')
five_hour_reset=$(extract '.rate_limits.five_hour.resets_at')
seven_day_pct=$(extract '.rate_limits.seven_day.used_percentage')
seven_day_reset=$(extract '.rate_limits.seven_day.resets_at')

segments=()

# Model + version
segments+=("MODEL=$model_name")
segments+=("VER=$version")

# Session
if [ -n "$session_name" ]; then
    segments+=("SESSION=$session_name")
fi

# Output style
if [ -n "$style" ] && [ "$style" != "default" ]; then
    segments+=("STYLE=$style")
fi

# Vim mode
if [ -n "$vim_mode" ]; then
    segments+=("VIM=$vim_mode")
fi

# Effort (reasoning tier)
if [ -n "$effort" ]; then
    segments+=("EFFORT=$effort")
fi

# Extended thinking
if [ -n "$thinking" ]; then
    segments+=("THINKING=$thinking")
fi

# Directories
segments+=("CWD=$cwd")
segments+=("PROJECT=$project_dir")
if [ -n "$worktree_original_cwd" ]; then
    segments+=("ORIG_CWD=$worktree_original_cwd")
fi

# Git repo + branch
if [ -n "$repo" ]; then
    segments+=("REPO=$repo")
fi
if [ -n "$git_branch" ]; then
    segments+=("BRANCH=$git_branch")
fi

# Worktree info
if [ -n "$worktree_name" ]; then
    segments+=("WORKTREE=$worktree_name")
    if [ -n "$worktree_branch" ]; then
        segments+=("WT_BRANCH=$worktree_branch")
    fi
fi

# Agent info
if [ -n "$agent_name" ]; then
    segments+=("AGENT=$agent_name")
    if [ -n "$agent_type" ]; then
        segments+=("AGENT_TYPE=$agent_type")
    fi
fi

# Context window
if [ -n "$ctx_size" ]; then
    segments+=("CTX_WINDOW=${ctx_size}tokens")
fi
if [ -n "$ctx_used" ]; then
    segments+=("CTX_USED=${ctx_used}%")
fi
if [ -n "$ctx_remaining" ]; then
    segments+=("CTX_REMAINING=${ctx_remaining}%")
fi

# Per-call token usage
if [ -n "$input_tokens" ]; then
    segments+=("INPUT_TOKENS=$input_tokens")
fi
if [ -n "$output_tokens" ]; then
    segments+=("OUTPUT_TOKENS=$output_tokens")
fi
if [ -n "$cache_create" ] && [ "$cache_create" != "0" ]; then
    segments+=("CACHE_CREATED=$cache_create")
fi
if [ -n "$cache_read" ] && [ "$cache_read" != "0" ]; then
    segments+=("CACHE_READ=$cache_read")
fi

# Claude.ai rate limits (subscription only)
if [ -n "$five_hour_pct" ]; then
    segments+=("RATE_5H=${five_hour_pct}%")
fi
if [ -n "$five_hour_reset" ]; then
    reset_time=$(date -d "@$(( five_hour_reset / 1000 ))" "+%H:%M" 2>/dev/null || echo "$five_hour_reset")
    segments+=("RATE_5H_RESETS=${reset_time}")
fi
if [ -n "$seven_day_pct" ]; then
    segments+=("RATE_7D=${seven_day_pct}%")
fi
if [ -n "$seven_day_reset" ]; then
    reset_time_7d=$(date -d "@$(( seven_day_reset / 1000 ))" "+%H:%M" 2>/dev/null || echo "$seven_day_reset")
    segments+=("RATE_7D_RESETS=${reset_time_7d}")
fi

# Open PR
if [ -n "$pr_num" ]; then
    segments+=("PR=$pr_num/$pr_state")
    if [ -n "$pr_state" ]; then
        segments+=("PR_STATE=$pr_state")
    fi
fi

printf '%s | ' "${segments[@]}" | sed 's/ | $//'
