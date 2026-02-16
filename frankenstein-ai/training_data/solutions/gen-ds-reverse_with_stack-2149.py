# Task: gen-ds-reverse_with_stack-2149 | Score: 100% | 2026-02-14T12:48:02.105112

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))