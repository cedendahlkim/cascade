# Task: gen-ds-reverse_with_stack-9205 | Score: 100% | 2026-02-13T10:13:37.733124

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))