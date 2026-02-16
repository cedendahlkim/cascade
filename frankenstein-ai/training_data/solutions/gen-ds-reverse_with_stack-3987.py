# Task: gen-ds-reverse_with_stack-3987 | Score: 100% | 2026-02-13T14:01:25.999607

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))