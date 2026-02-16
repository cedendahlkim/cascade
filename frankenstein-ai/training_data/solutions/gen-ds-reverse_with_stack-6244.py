# Task: gen-ds-reverse_with_stack-6244 | Score: 100% | 2026-02-15T08:05:48.425098

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))