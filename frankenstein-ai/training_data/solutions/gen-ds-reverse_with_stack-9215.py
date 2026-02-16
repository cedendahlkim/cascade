# Task: gen-ds-reverse_with_stack-9215 | Score: 100% | 2026-02-13T12:52:00.637467

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))