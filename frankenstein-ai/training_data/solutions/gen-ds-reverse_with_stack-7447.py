# Task: gen-ds-reverse_with_stack-7447 | Score: 100% | 2026-02-13T14:00:33.793855

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))