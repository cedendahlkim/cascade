# Task: gen-ds-reverse_with_stack-1409 | Score: 100% | 2026-02-13T14:42:28.440116

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))