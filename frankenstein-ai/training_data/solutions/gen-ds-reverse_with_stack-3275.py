# Task: gen-ds-reverse_with_stack-3275 | Score: 100% | 2026-02-15T07:53:01.518420

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))