# Task: gen-ds-reverse_with_stack-3457 | Score: 100% | 2026-02-13T18:28:27.124841

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))