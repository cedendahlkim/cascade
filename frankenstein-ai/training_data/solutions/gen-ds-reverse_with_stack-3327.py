# Task: gen-ds-reverse_with_stack-3327 | Score: 100% | 2026-02-13T11:18:19.862993

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))