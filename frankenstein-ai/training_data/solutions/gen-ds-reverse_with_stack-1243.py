# Task: gen-ds-reverse_with_stack-1243 | Score: 100% | 2026-02-15T10:10:00.467938

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))