# Task: gen-ds-reverse_with_stack-4305 | Score: 100% | 2026-02-13T14:42:02.985975

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))