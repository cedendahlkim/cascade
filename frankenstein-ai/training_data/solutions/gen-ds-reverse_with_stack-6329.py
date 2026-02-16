# Task: gen-ds-reverse_with_stack-6329 | Score: 100% | 2026-02-15T07:58:21.984433

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))