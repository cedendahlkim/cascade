# Task: gen-ds-reverse_with_stack-6251 | Score: 100% | 2026-02-13T12:52:02.811883

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))