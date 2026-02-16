# Task: gen-ds-reverse_with_stack-2653 | Score: 100% | 2026-02-13T20:32:29.355131

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))