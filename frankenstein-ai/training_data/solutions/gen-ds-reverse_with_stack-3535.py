# Task: gen-ds-reverse_with_stack-3535 | Score: 100% | 2026-02-13T16:47:00.229372

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))