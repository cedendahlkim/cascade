# Task: gen-ds-reverse_with_stack-6880 | Score: 100% | 2026-02-13T11:45:34.559688

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))