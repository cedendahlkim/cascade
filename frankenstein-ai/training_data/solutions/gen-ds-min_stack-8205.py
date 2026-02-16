# Task: gen-ds-min_stack-8205 | Score: 100% | 2026-02-12T16:40:21.852324

class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []

    def push(self, x):
        self.stack.append(x)
        if not self.min_stack or x <= self.min_stack[-1]:
            self.min_stack.append(x)

    def pop(self):
        if self.stack:
            popped = self.stack.pop()
            if popped == self.min_stack[-1]:
                self.min_stack.pop()

    def getMin(self):
        if self.min_stack:
            return self.min_stack[-1]
        return None

n = int(input())
stack = MinStack()

for _ in range(n):
    line = input().split()
    operation = line[0]

    if operation == "push":
        value = int(line[1])
        stack.push(value)
    elif operation == "pop":
        stack.pop()
    elif operation == "min":
        min_val = stack.getMin()
        if min_val is not None:
            print(min_val)