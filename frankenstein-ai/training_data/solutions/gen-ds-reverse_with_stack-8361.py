# Task: gen-ds-reverse_with_stack-8361 | Score: 100% | 2026-02-14T13:12:13.208411

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))