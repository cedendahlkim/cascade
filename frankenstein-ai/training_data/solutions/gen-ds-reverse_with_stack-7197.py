# Task: gen-ds-reverse_with_stack-7197 | Score: 100% | 2026-02-13T18:37:55.141048

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))