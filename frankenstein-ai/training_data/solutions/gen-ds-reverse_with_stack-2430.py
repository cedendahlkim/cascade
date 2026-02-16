# Task: gen-ds-reverse_with_stack-2430 | Score: 100% | 2026-02-15T08:05:32.425190

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))