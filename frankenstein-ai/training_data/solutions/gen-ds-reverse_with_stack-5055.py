# Task: gen-ds-reverse_with_stack-5055 | Score: 100% | 2026-02-13T15:10:33.643752

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))