# Task: gen-ds-reverse_with_stack-3369 | Score: 100% | 2026-02-13T17:11:11.585469

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))