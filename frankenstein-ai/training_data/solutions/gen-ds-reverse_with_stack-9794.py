# Task: gen-ds-reverse_with_stack-9794 | Score: 100% | 2026-02-15T08:48:39.670078

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))