# Task: gen-ds-reverse_with_stack-8812 | Score: 100% | 2026-02-13T17:11:32.781135

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))