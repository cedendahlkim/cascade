# Task: gen-ds-reverse_with_stack-5948 | Score: 100% | 2026-02-13T09:34:08.825095

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))