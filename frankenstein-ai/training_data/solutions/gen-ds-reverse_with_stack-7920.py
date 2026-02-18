# Task: gen-ds-reverse_with_stack-7920 | Score: 100% | 2026-02-17T20:01:55.302416

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))