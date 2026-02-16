# Task: gen-ds-reverse_with_stack-9457 | Score: 100% | 2026-02-13T18:00:16.980303

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))