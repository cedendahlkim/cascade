# Task: gen-ds-reverse_with_stack-8732 | Score: 100% | 2026-02-13T17:36:08.719385

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))