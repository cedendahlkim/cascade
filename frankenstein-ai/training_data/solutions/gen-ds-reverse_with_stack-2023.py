# Task: gen-ds-reverse_with_stack-2023 | Score: 100% | 2026-02-13T19:06:21.055145

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))