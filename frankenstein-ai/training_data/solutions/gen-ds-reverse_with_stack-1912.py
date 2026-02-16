# Task: gen-ds-reverse_with_stack-1912 | Score: 100% | 2026-02-13T19:47:43.921919

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))