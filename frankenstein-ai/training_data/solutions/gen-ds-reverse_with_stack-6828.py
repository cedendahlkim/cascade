# Task: gen-ds-reverse_with_stack-6828 | Score: 100% | 2026-02-13T16:27:26.077660

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))