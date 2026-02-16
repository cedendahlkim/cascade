# Task: gen-ds-reverse_with_stack-2382 | Score: 100% | 2026-02-15T07:46:02.875643

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))