# Task: gen-ds-reverse_with_stack-5739 | Score: 100% | 2026-02-13T14:00:34.214443

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))