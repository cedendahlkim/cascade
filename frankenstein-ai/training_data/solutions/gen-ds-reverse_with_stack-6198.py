# Task: gen-ds-reverse_with_stack-6198 | Score: 100% | 2026-02-13T11:54:45.618199

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))