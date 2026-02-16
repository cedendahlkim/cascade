# Task: gen-ds-reverse_with_stack-9582 | Score: 100% | 2026-02-13T20:33:13.904690

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))