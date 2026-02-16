# Task: gen-ds-reverse_with_stack-9214 | Score: 100% | 2026-02-13T19:47:52.701984

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))