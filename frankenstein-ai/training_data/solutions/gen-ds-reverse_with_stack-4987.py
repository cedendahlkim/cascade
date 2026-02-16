# Task: gen-ds-reverse_with_stack-4987 | Score: 100% | 2026-02-13T09:51:04.284492

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))