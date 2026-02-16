# Task: gen-ds-reverse_with_stack-3149 | Score: 100% | 2026-02-14T13:26:41.607479

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))