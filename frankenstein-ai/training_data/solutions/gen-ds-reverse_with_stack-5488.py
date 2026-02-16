# Task: gen-ds-reverse_with_stack-5488 | Score: 100% | 2026-02-15T09:02:00.970604

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))