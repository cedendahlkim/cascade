# Task: gen-ds-reverse_with_stack-8311 | Score: 100% | 2026-02-13T13:47:04.696631

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))