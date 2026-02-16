# Task: gen-ds-reverse_with_stack-6386 | Score: 100% | 2026-02-13T21:28:33.089352

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))